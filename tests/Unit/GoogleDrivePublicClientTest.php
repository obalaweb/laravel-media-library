<?php

namespace Codprez\MediaLibrary\Tests\Unit;

use Codprez\MediaLibrary\GoogleDrive\GoogleDrivePublicClient;
use Illuminate\Http\Client\Factory as HttpFactory;
use PHPUnit\Framework\TestCase;

class GoogleDrivePublicClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        putenv('GOOGLE_DRIVE_API_KEY=test-key');
        putenv('GOOGLE_DRIVE_ALLOWED_MIME_TYPES=image/jpeg,image/png');
    }

    public function test_list_folder_files_filters_non_images_and_maps_shape(): void
    {
        $http = new HttpFactory;
        $http->fake([
            'https://www.googleapis.com/drive/v3/files*' => $http->response([
                'files' => [
                    ['id' => '1', 'name' => 'a.jpg', 'mimeType' => 'image/jpeg', 'size' => '123'],
                    ['id' => '2', 'name' => 'b.pdf', 'mimeType' => 'application/pdf', 'size' => '55'],
                    ['id' => '3', 'name' => 'c.png', 'mimeType' => 'image/png'],
                ],
            ], 200),
        ]);

        $client = new GoogleDrivePublicClient($http);
        $files = $client->listFolderFiles('folder-1');

        $this->assertCount(2, $files);
        $this->assertSame('1', $files[0]['id']);
        $this->assertSame('image/jpeg', $files[0]['mime_type']);
        $this->assertSame(123, $files[0]['size']);
        $this->assertSame('3', $files[1]['id']);
        $this->assertNull($files[1]['size']);
    }

    public function test_download_file_uses_confirm_token_when_html_warning_page_is_returned(): void
    {
        $http = new HttpFactory;
        $http->fake([
            'https://drive.google.com/uc*' => $http->sequence()
                ->push('<a href="/uc?export=download&amp;confirm=t123&amp;id=file-abc">download</a>', 200, [
                    'Content-Type' => 'text/html; charset=utf-8',
                ])
                ->push('BINARY_IMAGE_DATA', 200, [
                    'Content-Type' => 'image/jpeg',
                ]),
        ]);

        $client = new GoogleDrivePublicClient($http);
        $response = $client->downloadFile('file-abc');

        $this->assertSame('BINARY_IMAGE_DATA', $response->body());
        $recorded = $http->recorded();
        $this->assertCount(2, $recorded);

        $containsConfirm = false;
        foreach ($recorded as $pair) {
            if (str_contains($pair[0]->url(), 'confirm=t123')) {
                $containsConfirm = true;
                break;
            }
        }

        $this->assertTrue($containsConfirm);
    }

    public function test_list_folder_files_throws_when_api_key_is_missing(): void
    {
        putenv('GOOGLE_DRIVE_API_KEY');

        $client = new GoogleDrivePublicClient(new HttpFactory);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('GOOGLE_DRIVE_API_KEY is required for folder imports.');

        $client->listFolderFiles('folder-1');
    }

    public function test_public_file_metadata_extracts_name_mime_and_size(): void
    {
        $http = new HttpFactory;
        $http->fake([
            'https://drive.google.com/uc*' => $http->response('image-bytes', 200, [
                'Content-Type' => 'image/jpeg',
                'Content-Length' => '42',
                'Content-Disposition' => 'attachment; filename="photo.jpg"',
            ]),
        ]);

        $client = new GoogleDrivePublicClient($http);
        $metadata = $client->getPublicFileMetadata('file-abc');

        $this->assertSame('photo.jpg', $metadata['name']);
        $this->assertSame('image/jpeg', $metadata['mime_type']);
        $this->assertSame(42, $metadata['size']);
    }
}
