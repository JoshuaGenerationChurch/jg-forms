<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class AdminInvitation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'token_hash',
        'role_name',
        'invited_by_user_id',
        'expires_at',
        'accepted_at',
        'accepted_by_user_id',
        'revoked_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function invitedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function acceptedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }

    public function isPending(): bool
    {
        return $this->accepted_at === null && $this->revoked_at === null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return $this->isPending() && ! $this->isExpired();
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', trim($token));
    }

    public function expiresAtHuman(): string
    {
        if (! $this->expires_at instanceof Carbon) {
            return 'No expiry';
        }

        return $this->expires_at->timezone(config('app.timezone'))->toDateTimeString();
    }
}
