<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('guests can fetch digital media options', function () {
    config([
        'services.jg.base_url' => 'https://jg-api.test',
        'services.jg.hubs_endpoint' => '/hubs',
        'services.jg.venues_endpoint' => '/venues',
        'services.jg.congregations_endpoint' => '/congregations',
        'services.jg.token' => 'test-token',
    ]);

    Http::fake([
        'https://jg-api.test/hubs' => Http::response([
            ['title' => ['rendered' => 'Central RSA']],
        ], 200),
        'https://jg-api.test/venues' => Http::response([
            ['title' => ['rendered' => 'City Hall']],
        ], 200),
        'https://jg-api.test/congregations' => Http::response([
            'data' => [
                ['name' => 'City Bowl AM'],
            ],
        ], 200),
    ]);

    $response = $this->get(route('work-request.digital-media-options'));

    $response
        ->assertOk()
        ->assertJson([
            'hubs' => ['Central RSA'],
            'venues' => ['City Hall'],
            'congregations' => ['City Bowl AM'],
        ]);
});

test('authenticated users can fetch digital media options from the jg api', function () {
    config([
        'services.jg.base_url' => 'https://jg-api.test',
        'services.jg.hubs_endpoint' => '/hubs',
        'services.jg.venues_endpoint' => '/venues',
        'services.jg.congregations_endpoint' => '/congregations',
        'services.jg.token' => 'test-token',
    ]);

    Http::fake([
        'https://jg-api.test/hubs' => Http::response([
            ['name' => 'Central RSA'],
            ['name' => 'Northern Suburbs'],
        ], 200),
        'https://jg-api.test/venues' => Http::response([
            ['title' => ['rendered' => 'Centurion Hall']],
            ['title' => ['rendered' => 'Durbanville PM Hall']],
        ], 200),
        'https://jg-api.test/congregations' => Http::response([
            'data' => [
                ['name' => 'City Bowl AM'],
                ['name' => 'Durbanville AM'],
            ],
        ], 200),
    ]);

    $this->actingAs(User::factory()->create());

    $response = $this->get(route('work-request.digital-media-options'));

    $response
        ->assertOk()
        ->assertJson([
            'hubs' => ['Central RSA', 'Northern Suburbs'],
            'venues' => ['Centurion Hall', 'Durbanville PM Hall'],
            'congregations' => ['City Bowl AM', 'Durbanville AM'],
        ]);
});
