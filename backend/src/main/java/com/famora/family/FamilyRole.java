package com.famora.family;

/** A member's role in one family. Higher rank can do everything a lower rank can. */
public enum FamilyRole {
    MEMBER(1),
    ADMIN(2),
    OWNER(3);

    private final int rank;

    FamilyRole(int rank) {
        this.rank = rank;
    }

    public boolean atLeast(FamilyRole other) {
        return rank >= other.rank;
    }
}
