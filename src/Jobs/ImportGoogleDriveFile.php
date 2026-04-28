<?php

namespace Codprez\MediaLibrary\Jobs;

use Codprez\MediaLibrary\GoogleDrive\GoogleDrivePublicClient;
use Codprez\MediaLibrary\Models\Media;
use Codprez\MediaLibrary\Models\MediaImportBatch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ImportGoogleDriveFile implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly int $batchId,
        public readonly string $fileId,
        public readonly string $fileName,
        public readonly string $mimeType,
    ) {
    }

    public function handle(GoogleDrivePublicClient $client): void
    {
        $tmpPath = null;
        $batch = MediaImportBatch::query()->find($this->batchId);
        if (! $batch) {
            return;
        }

        $batch->increment('processing_count');
        $this->syncPendingCount($batch);
        $batch->update(['status' => 'processing']);

        if (Media::query()->where('source', 'google_drive')->where('source_id', $this->fileId)->exists()) {
            $batch->increment('skipped_count');
            $this->finalizeBatchStatus($batch);

            return;
        }

        try {
            $disk = config('media-library.disk', 'public');
            $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '-', $this->fileName) ?: 'google-drive-file';
            $path = 'media/google-drive/'.$this->fileId.'-'.$safeName;
            $tmpPath = tempnam(sys_get_temp_dir(), 'gdrive-import-');
            if ($tmpPath === false) {
                throw new \RuntimeException('Unable to create temporary file for import.');
            }

            $downloadMeta = $client->downloadFileToPath($this->fileId, $tmpPath);

            $stream = fopen($tmpPath, 'rb');
            if ($stream === false) {
                throw new \RuntimeException('Unable to read downloaded file.');
            }
            Storage::disk($disk)->put($path, $stream);
            fclose($stream);

            try {
                Media::query()->create([
                    'name' => pathinfo($this->fileName, PATHINFO_FILENAME),
                    'original_name' => $this->fileName,
                    'file_name' => basename($path),
                    'mime_type' => $this->mimeType,
                    'type' => str_starts_with($this->mimeType, 'image/') ? 'image' : 'document',
                    'source' => 'google_drive',
                    'source_id' => $this->fileId,
                    'import_batch_id' => $batch->id,
                    'imported_at' => now(),
                    'path' => $path,
                    'url' => Storage::disk($disk)->url($path),
                    'size' => $downloadMeta['size'] ?? (int) Storage::disk($disk)->size($path),
                    'uploaded_by' => null,
                ]);
            } catch (QueryException $exception) {
                if ($this->isDuplicateSourceConstraintViolation($exception)) {
                    $batch->increment('skipped_count');
                    $this->finalizeBatchStatus($batch);

                    return;
                }

                throw $exception;
            }

            $batch->increment('imported_count');
            $this->finalizeBatchStatus($batch);
        } catch (Throwable $exception) {
            if ($this->attempts() >= $this->tries) {
                $batch->increment('failed_count');
            }
            $this->finalizeBatchStatus($batch);
            throw $exception;
        } finally {
            if (is_string($tmpPath) && $tmpPath !== '' && file_exists($tmpPath)) {
                @unlink($tmpPath);
            }
        }
    }

    private function finalizeBatchStatus(MediaImportBatch $batch): void
    {
        $batch->decrement('processing_count');
        $this->syncPendingCount($batch);
        $batch->refresh();

        if (($batch->pending_count + $batch->processing_count) === 0) {
            $batch->update([
                'status' => $batch->failed_count > 0 ? 'completed_with_errors' : 'completed',
            ]);
        }
    }

    private function syncPendingCount(MediaImportBatch $batch): void
    {
        $batch->refresh();
        $pending = max(
            $batch->total_count - ($batch->processing_count + $batch->imported_count + $batch->failed_count + $batch->skipped_count),
            0
        );

        $batch->update(['pending_count' => $pending]);
    }

    private function isDuplicateSourceConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');

        return $sqlState === '23000' || str_contains($exception->getMessage(), 'media_source_source_id_unique');
    }
}
