package org.patinanetwork.patchats.api.member.db.repos;

import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.api.member.db.models.Member;

public interface MemberRepo {
    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param member - required fields:
     *     <ul>
     *       <li>id
     *       <li>firstName
     *       <li>lastName
     *       <li>email
     *       <li>introduction
     *       <li>active
     *       <li>createdAt
     *       <li>updatedAt
     *     </ul>
     */
    Member createMember(Member member);

    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param member - overridden fields:
     *     <ul>
     *       <li>firstName
     *       <li>lastName
     *       <li>email
     *       <li>linkedInUrl
     *       <li>introduction
     *       <li>referralSource
     *       <li>active
     *       <li>matchPref
     *       <li>industryPref
     *       <li>rolePref
     *       <li>topics
     *       <li>extraNotes
     *     </ul>
     */
    Optional<Member> updateMember(Member member);

    Optional<Member> getMemberById(UUID id);

    Optional<Member> getMemberByEmail(String email);

    Optional<Member> deactivateMemberById(UUID id);
}
