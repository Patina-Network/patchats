package org.patinanetwork.patchats.matchingalgo.model;

import java.util.List;
import java.util.Optional;
import org.patinanetwork.patchats.api.member.db.models.Member;

/**
 * Output of one matching run: the pairs made, plus the leftover member when the member count is odd. The leftover is
 * placed manually by an admin.
 */
public record PairingResult(List<MemberPair> pairs, Optional<Member> unmatched) {}
