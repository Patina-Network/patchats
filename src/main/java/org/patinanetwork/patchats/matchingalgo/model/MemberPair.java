package org.patinanetwork.patchats.matchingalgo.model;

import org.patinanetwork.patchats.api.member.db.models.Member;

/** Two members paired by the matching algorithm, with the score the active layers gave the pair. */
public record MemberPair(Member memberA, Member memberB, int score) {}
