<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_forms', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('url');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        $forms = config('workforms.forms', []);

        if (is_array($forms) && count($forms) > 0) {
            $rows = collect($forms)
                ->filter(static fn (mixed $form): bool => is_array($form))
                ->map(static function (array $form) use ($now): array {
                    return [
                        'slug' => (string) ($form['slug'] ?? ''),
                        'title' => (string) ($form['title'] ?? ''),
                        'description' => (string) ($form['description'] ?? ''),
                        'url' => (string) ($form['url'] ?? ''),
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })
                ->filter(static fn (array $row): bool => $row['slug'] !== '' && $row['title'] !== '' && $row['url'] !== '')
                ->values()
                ->all();

            if (count($rows) > 0) {
                DB::table('work_forms')->insert($rows);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_forms');
    }
};
