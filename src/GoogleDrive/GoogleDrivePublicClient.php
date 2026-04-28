<?php

namespace Codprez\MediaLibrary\GoogleDrive;

use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\Factory as HttpFactory;
use RuntimeException;

class GoogleDrivePublicClient
{
    public function __construct(
        private readonly ?HttpFactory $http = null
    ) {
    }

    /**
     * @return array<int, array{id: string, name: string, mime_type: string, size: int|null}>
     */
    public function listFolderFiles(string $folderId): array
    {
        $apiKey = (string) $this->configValue('media-library.google_drive.api_key', '');
        if ($apiKey === '') {
            throw new RuntimeException('GOOGLE_DRIVE_API_KEY is required for folder imports.');
        }

        $response = $this->http()->get('https://www.googleapis.com/drive/v3/files', [
            'q' => sprintf("'%s' in parents and trashed=false", $folderId),
            'key' => $apiKey,
            'fields' => 'files(id,name,mimeType,size)',
            'pageSize' => 1000,
            'supportsAllDrives' => 'true',
            'includeItemsFromAllDrives' => 'true',
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to list files from Google Drive folder.');
        }

        $allowedMimeTypes = $this->configValue('media-library.google_drive.allowed_mime_types', []);
        $files = $response->json('files', []);

        return collect($files)
            ->filter(fn (array $file) => in_array($file['mimeType'] ?? '', $allowedMimeTypes, true))
            ->map(fn (array $file): array => [
                'id' => (string) ($file['id'] ?? ''),
                'name' => (string) ($file['name'] ?? ''),
                'mime_type' => (string) ($file['mimeType'] ?? 'application/octet-stream'),
                'size' => isset($file['size']) ? (int) $file['size'] : null,
            ])
            ->filter(fn (array $file) => $file['id'] !== '')
            ->values()
            ->all();
    }

    public function downloadFile(string $fileId): Response
    {
        return $this->resolveDownloadResponse($fileId);
    }

    /**
     * @return array{name: string, mime_type: string, size: int|null}
     */
    public function getPublicFileMetadata(string $fileId): array
    {
        $response = $this->resolveDownloadResponse($fileId);
        $disposition = (string) $response->header('content-disposition', '');

        return [
            'name' => $this->extractFilename($disposition) ?? ('google-drive-'.$fileId),
            'mime_type' => (string) $response->header('content-type', 'application/octet-stream'),
            'size' => $response->header('content-length') !== null ? (int) $response->header('content-length') : null,
        ];
    }

    /**
     * @return array{mime_type: string, size: int|null}
     */
    public function downloadFileToPath(string $fileId, string $targetPath): array
    {
        $initialResponse = $this->http()->withOptions([
            'allow_redirects' => true,
            'sink' => $targetPath,
        ])->get('https://drive.google.com/uc', [
            'export' => 'download',
            'id' => $fileId,
        ]);

        if ($initialResponse->failed()) {
            throw new RuntimeException('Unable to download file from Google Drive.');
        }

        $contentType = (string) $initialResponse->header('content-type', '');
        if (! str_contains($contentType, 'text/html')) {
            return [
                'mime_type' => (string) $initialResponse->header('content-type', 'application/octet-stream'),
                'size' => $initialResponse->header('content-length') !== null ? (int) $initialResponse->header('content-length') : null,
            ];
        }

        $html = @file_get_contents($targetPath) ?: '';
        $token = $this->extractConfirmToken($html);
        if ($token === null) {
            return [
                'mime_type' => (string) $initialResponse->header('content-type', 'application/octet-stream'),
                'size' => $initialResponse->header('content-length') !== null ? (int) $initialResponse->header('content-length') : null,
            ];
        }

        $confirmedResponse = $this->http()->withOptions([
            'allow_redirects' => true,
            'sink' => $targetPath,
        ])->get('https://drive.google.com/uc', [
            'export' => 'download',
            'id' => $fileId,
            'confirm' => $token,
        ]);

        if ($confirmedResponse->failed()) {
            throw new RuntimeException('Unable to confirm large file download from Google Drive.');
        }

        return [
            'mime_type' => (string) $confirmedResponse->header('content-type', 'application/octet-stream'),
            'size' => $confirmedResponse->header('content-length') !== null ? (int) $confirmedResponse->header('content-length') : null,
        ];
    }

    private function extractConfirmToken(string $html): ?string
    {
        if (preg_match('/confirm=([0-9A-Za-z_]+)&amp;id=/', $html, $matches) === 1) {
            return $matches[1];
        }

        return null;
    }

    private function extractFilename(string $disposition): ?string
    {
        if (preg_match('/filename\*?=(?:UTF-8\'\')?"?([^";]+)"?/i', $disposition, $matches) !== 1) {
            return null;
        }

        return rawurldecode(trim($matches[1]));
    }

    /**
     * @return mixed
     */
    private function configValue(string $key, mixed $default = null): mixed
    {
        if (function_exists('config')) {
            return config($key, $default);
        }

        return match ($key) {
            'media-library.google_drive.api_key' => getenv('GOOGLE_DRIVE_API_KEY') ?: $default,
            'media-library.google_drive.allowed_mime_types' => $this->envMimeTypesOrDefault($default),
            default => $default,
        };
    }

    /**
     * @param  mixed  $default
     * @return mixed
     */
    private function envMimeTypesOrDefault(mixed $default): mixed
    {
        $raw = getenv('GOOGLE_DRIVE_ALLOWED_MIME_TYPES');
        if (! is_string($raw) || trim($raw) === '') {
            return $default;
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    private function http(): HttpFactory
    {
        return $this->http ?? new HttpFactory;
    }

    private function resolveDownloadResponse(string $fileId): Response
    {
        $initialResponse = $this->http()->withOptions(['allow_redirects' => true])
            ->get('https://drive.google.com/uc', [
                'export' => 'download',
                'id' => $fileId,
            ]);

        if ($initialResponse->failed()) {
            throw new RuntimeException('Unable to download file from Google Drive.');
        }

        if (! str_contains((string) $initialResponse->header('content-type'), 'text/html')) {
            return $initialResponse;
        }

        $token = $this->extractConfirmToken($initialResponse->body());
        if ($token === null) {
            return $initialResponse;
        }

        $confirmedResponse = $this->http()->withOptions(['allow_redirects' => true])
            ->get('https://drive.google.com/uc', [
                'export' => 'download',
                'id' => $fileId,
                'confirm' => $token,
            ]);

        if ($confirmedResponse->failed()) {
            throw new RuntimeException('Unable to confirm large file download from Google Drive.');
        }

        return $confirmedResponse;
    }
}
