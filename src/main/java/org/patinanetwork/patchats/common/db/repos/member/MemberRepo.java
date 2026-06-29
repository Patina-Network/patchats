package org.patinanetwork.patchats.common.db.repos.member;

import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.common.db.models.member.Member;

public interface MemberRepo {
    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param member - required fields:
     *     <ul>
     *       <li>id
     *       <li>fullName
     *       <li>email
     *       <li>introduction
     *       <li>createdAt
     *       <li>updatedAt
     *     </ul>
     */
    Member createMember(Member member);

    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param member - overridden fields:
     *     <ul>
     *       <li>fullName
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
    boolean editMember(Member member);

    Optional<Member> getMemberById(UUID id);

    Optional<Member> getMemberByEmail(String email);

    boolean deleteMemberById(UUID id);
}
