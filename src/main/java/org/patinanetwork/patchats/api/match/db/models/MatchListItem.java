package org.patinanetwork.patchats.api.match.db.models;

import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

/** A match joined with the display fields an admin list needs: the cycle period and both members' names. */
@Getter
@Builder
@ToString
@EqualsAndHashCode
public class MatchListItem {

    private Match match;

    private String period;

    private String memberAFirstName;

    private String memberALastName;

    private String memberBFirstName;

    private String memberBLastName;
}
