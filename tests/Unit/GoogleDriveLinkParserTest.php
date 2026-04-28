<?php

namespace Codprez\MediaLibrary\Tests\Unit;

use Codprez\MediaLibrary\GoogleDrive\GoogleDriveLinkParser;
use PHPUnit\Framework\TestCase;

class GoogleDriveLinkParserTest extends TestCase
{
    public function test_parses_file_url_with_d_segment(): void
    {
        $parsed = GoogleDriveLinkParser::parse('https://drive.google.com/file/d/abc123/view?usp=sharing');

        $this->assertSame('file', $parsed['type']);
        $this->assertSame('abc123', $parsed['id']);
    }

    public function test_parses_file_url_with_id_query_param(): void
    {
        $parsed = GoogleDriveLinkParser::parse('https://drive.google.com/open?id=file987');

        $this->assertSame('file', $parsed['type']);
        $this->assertSame('file987', $parsed['id']);
    }

    public function test_parses_folder_url(): void
    {
        $parsed = GoogleDriveLinkParser::parse('https://drive.google.com/drive/folders/folder456');

        $this->assertSame('folder', $parsed['type']);
        $this->assertSame('folder456', $parsed['id']);
    }

    public function test_throws_for_unsupported_url(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        GoogleDriveLinkParser::parse('https://example.com/file/1');
    }
}
