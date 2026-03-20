<?php

namespace Codprez\MediaLibrary\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'original_name' => $this->original_name,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'type' => $this->type,
            'url' => $this->url,
            'size' => $this->size,
            'formatted_size' => $this->formatted_size,
            'thumbnail_url' => $this->thumbnail_url,
            'medium_url' => $this->medium_url,
            'large_url' => $this->large_url,
            'webp_url' => $this->webp_url,
            'created_at' => $this->created_at,
        ];
    }
}
