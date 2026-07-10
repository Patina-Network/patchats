package org.patinanetwork.patchats.api.member.db.repos;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class MemberSqlRepo implements MemberRepo {

    @Override
    public Member createMember(Member member) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Optional<Member> updateMember(Member member) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Optional<Member> getMemberById(UUID id) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Optional<Member> getMemberByEmail(String email) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public Optional<Member> deactivateMemberById(UUID id) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
