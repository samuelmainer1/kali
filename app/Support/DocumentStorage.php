<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

class DocumentStorage
{
    public static function name(): string
    {
        return (string) config('filesystems.documents_disk', 'documents');
    }

    public static function disk(): Filesystem
    {
        return Storage::disk(self::name());
    }
}
