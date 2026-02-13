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
        if (! Schema::hasColumn('work_request_entries', 'form_slug')) {
            Schema::table('work_request_entries', function (Blueprint $table) {
                $table->string('form_slug')->default('work-request')->after('user_id');
            });
        }

        DB::table('work_request_entries')
            ->whereNull('form_slug')
            ->update(['form_slug' => 'work-request']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('work_request_entries', 'form_slug')) {
            Schema::table('work_request_entries', function (Blueprint $table) {
                $table->dropColumn('form_slug');
            });
        }
    }
};
