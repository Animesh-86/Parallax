package com.parallax.backend.parallax.service.execution;

@FunctionalInterface
public interface RunOutputSink {
    void onOutput(String output);
}
