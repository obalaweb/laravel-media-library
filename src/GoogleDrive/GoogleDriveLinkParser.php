<?php

namespace Codprez\MediaLibrary\GoogleDrive;

use InvalidArgumentException;

class GoogleDriveLinkParser
{
    /**
     * @return array{type: 'file'|'folder', id: string}
     */
    public static function parse(string $url): array
    {
        $trimmedUrl = trim($url);

        if (! str_contains($trimmedUrl, 'drive.google.com')) {
            throw new InvalidArgumentException('Only Google Drive links are supported.');
        }

        $path = (string) parse_url($trimmedUrl, PHP_URL_PATH);
        $query = (string) parse_url($trimmedUrl, PHP_URL_QUERY);

        if (preg_match('#/file/d/([a-zA-Z0-9_-]+)#', $path, $matches) === 1) {
            return ['type' => 'file', 'id' => $matches[1]];
        }

        if (preg_match('#/drive/folders/([a-zA-Z0-9_-]+)#', $path, $matches) === 1) {
            return ['type' => 'folder', 'id' => $matches[1]];
        }

        parse_str($query, $queryParams);
        if (isset($queryParams['id']) && is_string($queryParams['id']) && $queryParams['id'] !== '') {
            return ['type' => 'file', 'id' => $queryParams['id']];
        }

        throw new InvalidArgumentException('Unable to parse the provided Google Drive link.');
    }
}
