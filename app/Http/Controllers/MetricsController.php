<?php

namespace App\Http\Controllers;

use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;
use Prometheus\Storage\Redis;

class MetricsController extends Controller
{
    public function index()
    {
        try {
            $registry = new CollectorRegistry(new Redis(['host' => 'redis']));
            $renderer = new RenderTextFormat();
            $result = $renderer->render($registry->getMetricFamilySamples());
            
            return response($result, 200)->header('Content-Type', RenderTextFormat::MIME_TYPE);
        } catch (\Exception $e) {
            return response('Metrics not available', 503);
        }
    }
}
