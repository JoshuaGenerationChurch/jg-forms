<?php

namespace Database\Factories;

use App\Models\WorkForm;
use App\Models\WorkFormEmailTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkFormEmailTemplate>
 */
class WorkFormEmailTemplateFactory extends Factory
{
    protected $model = WorkFormEmailTemplate::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $form = WorkForm::query()->first();

        return [
            'work_form_id' => $form?->id ?? WorkForm::query()->create([
                'slug' => 'work-request',
                'title' => 'Work Request Form',
                'description' => 'Auto-created by template factory.',
                'url' => '/work-request',
                'is_active' => true,
            ])->id,
            'trigger_event' => 'submission_created',
            'name' => $this->faker->words(3, true),
            'subject' => '[JG Forms] New submission: {{form.title}}',
            'heading' => 'New Form Submission',
            'body' => "Form: {{form.title}}\nEntry ID: {{entry.id}}\nRequester: {{entry.first_name}} {{entry.last_name}}",
            'to_recipients' => [
                ['email' => $this->faker->safeEmail(), 'name' => null],
            ],
            'cc_recipients' => [],
            'bcc_recipients' => [],
            'use_default_recipients' => true,
            'is_active' => true,
            'position' => 0,
        ];
    }
}
