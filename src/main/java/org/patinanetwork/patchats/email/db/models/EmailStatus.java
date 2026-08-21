package org.patinanetwork.patchats.email.db.models;

/** Lifecycle of a single outbox row. Terminal states are {@link #SENT} and {@link #ERROR}. */
public enum EmailStatus {
    PENDING,
    PROCESSING,
    SENT,
    ERROR
}
