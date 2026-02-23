<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_form_email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_form_id')
                ->constrained('work_forms')
                ->cascadeOnDelete();
            $table->string('trigger_event')->default('submission_created');
            $table->string('name');
            $table->string('subject');
            $table->string('heading')->nullable();
            $table->longText('body');
            $table->json('to_recipients');
            $table->json('cc_recipients')->nullable();
            $table->json('bcc_recipients')->nullable();
            $table->boolean('use_default_recipients')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['work_form_id', 'trigger_event', 'is_active'], 'work_form_email_template_event_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_form_email_templates');
    }
};
