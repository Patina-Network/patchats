package org.patinanetwork.patchats.email.db.models;

/** Which producer enqueued a sending session. */
public enum EmailSource {
    MANUAL,
    MATCHING,
    SYNCHRONOUS,
    ASYNCHRONOUS,
}
