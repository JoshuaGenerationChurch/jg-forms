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
        Schema::create('work_request_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('form_slug')->default('work-request')->index();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('cellphone')->nullable();
            $table->string('congregation')->nullable();
            $table->text('request_summary')->nullable();
            $table->string('event_name')->nullable();
            $table->boolean('includes_dates_venue')->default(false);
            $table->boolean('includes_registration')->default(false);
            $table->boolean('includes_graphics')->default(false);
            $table->boolean('includes_graphics_digital')->default(false);
            $table->boolean('includes_graphics_print')->default(false);
            $table->boolean('includes_signage')->default(false);
            $table->json('payload');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_request_entries');
    }
};
