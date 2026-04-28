<?php

namespace Codprez\MediaLibrary\Services;

use Codprez\MediaLibrary\GoogleDrive\GoogleDriveLinkParser;
use Codprez\MediaLibrary\GoogleDrive\GoogleDrivePublicClient;
use Codprez\MediaLibrary\Jobs\ImportGoogleDriveFile;
use Codprez\MediaLibrary\Models\Media;
use Codprez\MediaLibrary\Models\MediaImportBatch;
use Illuminate\Support\Arr;
use InvalidArgumentException;

class GoogleDriveImportService
{
    public function __construct(
        private readonly GoogleDrivePublicClient $client
    ) {
    }

    /**
     * @return array{type: string, id: string, files: array<int, array{id: string, name: string, mime_type: string, size: int|null, already_imported: bool}>}
     */
    public function preview(string $url): array
    {
        $parsed = GoogleDriveLinkParser::parse($url);
        $allowedMimeTypes = $this->allowedMimeTypes();

        if ($parsed['type'] === 'file') {
            $metadata = $this->client->getPublicFileMetadata($parsed['id']);

            return [
                'type' => 'file',
                'id' => $parsed['id'],
                'files' => [[
                    'id' => $parsed['id'],
                    'name' => $metadata['name'],
                    'mime_type' => $metadata['mime_type'],
                    'size' => $metadata['size'],
                    'is_allowed' => in_array($metadata['mime_type'], $allowedMimeTypes, true),
                    'already_imported' => Media::query()
                        ->where('source', 'google_drive')
                        ->where('source_id', $parsed['id'])
                        ->exists(),
                ]],
            ];
        }

        $files = $this->client->listFolderFiles($parsed['id']);

        $enrichedFiles = array_map(function (array $file) use ($allowedMimeTypes): array {
            $file['already_imported'] = Media::query()
                ->where('source', 'google_drive')
                ->where('source_id', $file['id'])
                ->exists();
            $file['is_allowed'] = in_array($file['mime_type'], $allowedMimeTypes, true);

            return $file;
        }, $files);

        return [
            'type' => 'folder',
            'id' => $parsed['id'],
            'files' => $enrichedFiles,
        ];
    }

    /**
     * @param  array<int, string>|null  $selectedFileIds
     */
    public function startImport(string $url, ?array $selectedFileIds = null): MediaImportBatch
    {
        $preview = $this->preview($url);
        $allFiles = $preview['files'];
        $selectedFileIds = $selectedFileIds ?? array_column($allFiles, 'id');

        $selectedFiles = array_values(array_filter(
            $allFiles,
            fn (array $file) => in_array($file['id'], $selectedFileIds, true)
        ));
        $selectedFiles = array_values(array_filter(
            $selectedFiles,
            fn (array $file) => ! empty($file['is_allowed'])
        ));

        if ($selectedFiles === []) {
            throw new InvalidArgumentException('No files selected for import.');
        }

        $batch = MediaImportBatch::query()->create([
            'source' => 'google_drive',
            'source_folder_id' => $preview['type'] === 'folder' ? $preview['id'] : null,
            'status' => 'queued',
            'total_count' => count($selectedFiles),
            'pending_count' => count($selectedFiles),
            'meta' => [
                'link_type' => $preview['type'],
                'source_id' => $preview['id'],
                'selected_file_ids' => $selectedFileIds,
            ],
            'created_by' => auth()->id(),
        ]);

        foreach ($selectedFiles as $file) {
            ImportGoogleDriveFile::dispatch(
                batchId: $batch->id,
                fileId: Arr::get($file, 'id'),
                fileName: Arr::get($file, 'name', 'google-drive-file'),
                mimeType: Arr::get($file, 'mime_type', 'application/octet-stream')
            );
        }

        return $batch;
    }

    /**
     * @return array<int, string>
     */
    private function allowedMimeTypes(): array
    {
        return (array) config('media-library.google_drive.allowed_mime_types', []);
    }
}
