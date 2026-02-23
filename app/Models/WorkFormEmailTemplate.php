<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkFormEmailTemplate extends Model
{
    /** @use HasFactory<\Database\Factories\WorkFormEmailTemplateFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'work_form_id',
        'trigger_event',
        'name',
        'subject',
        'heading',
        'body',
        'to_recipients',
        'cc_recipients',
        'bcc_recipients',
        'use_default_recipients',
        'is_active',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'to_recipients' => 'array',
            'cc_recipients' => 'array',
            'bcc_recipients' => 'array',
            'use_default_recipients' => 'boolean',
            'is_active' => 'boolean',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<WorkForm, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(WorkForm::class, 'work_form_id');
    }
}
