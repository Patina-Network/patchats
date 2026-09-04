package org.patinanetwork.patchats.api.member;

import java.util.Optional;
import org.patinanetwork.patchats.api.member.dto.CreateMemberRequest;
import org.patinanetwork.patchats.api.member.dto.UpdateMemberRequest;

final class MemberTestFixtures {

    static final CreateMemberRequest CREATE_REQUEST_ALL_FIELDS = new CreateMemberRequest(
            "John",
            "Doe",
            "john.doe@example.com",
            "https://www.linkedin.com/in/johndoe",
            "Hello, I'm John!",
            "Friend",
            "Mentor - I am looking for guidance from someone with more experience",
            "Technology",
            "Software Engineer",
            "College, Career Development",
            "I want to be meet someone in person in NYC");

    static final UpdateMemberRequest UPDATE_REQUEST_ALL_FIELDS = new UpdateMemberRequest(
            Optional.of("UpdatedFirstName"),
            Optional.of("UpdatedLastName"),
            Optional.empty(), // Email changes are not currently supported
            Optional.of("https://linkedin.com/in/updated"),
            Optional.of("Updated intro"),
            Optional.of("Mentor - I am looking for guidance from someone with more experience"),
            Optional.of("Technology"),
            Optional.of("Software Engineer"),
            Optional.of("AI,ML"),
            Optional.of("Notes"));

    private MemberTestFixtures() {}
}
