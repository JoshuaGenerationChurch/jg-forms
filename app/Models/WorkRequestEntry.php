<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkRequestEntry extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'form_slug',
        'first_name',
        'last_name',
        'email',
        'cellphone',
        'congregation',
        'request_summary',
        'event_name',
        'includes_dates_venue',
        'includes_registration',
        'includes_graphics',
        'includes_graphics_digital',
        'includes_graphics_print',
        'includes_signage',
        'payload',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'includes_dates_venue' => 'boolean',
            'includes_registration' => 'boolean',
            'includes_graphics' => 'boolean',
            'includes_graphics_digital' => 'boolean',
            'includes_graphics_print' => 'boolean',
            'includes_signage' => 'boolean',
            'payload' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
