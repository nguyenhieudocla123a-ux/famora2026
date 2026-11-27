package com.famora.user;

/** ACTIVE can sign in; LOCKED is blocked by an admin; DELETED is anonymised but kept for foreign keys. */
public enum UserStatus {
    ACTIVE,
    LOCKED,
    DELETED
}
