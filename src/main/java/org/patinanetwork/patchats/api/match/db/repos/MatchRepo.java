package org.patinanetwork.patchats.api.match.db.repos;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.patinanetwork.patchats.api.match.db.models.Match;

public interface MatchRepo {
    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param match - required fields:
     *     <ul>
     *       <li>id
     *       <li>memberAId
     *       <li>memberBId
     *       <li>matchCycleId
     *     </ul>
     */
    Match createMatch(Match match);

    /**
     * @note - The provided object's methods will be overridden with any returned data from the database.
     * @param match - overridden fields:
     *     <ul>
     *       <li>memberAId
     *       <li>memberBId
     *       <li>matchCycleId
     *       <li>matchScore
     *       <li>status
     *     </ul>
     */
    Optional<Match> updateMatch(Match match);

    Optional<Match> getMatchById(UUID id);

    Optional<Match> setMatchStatus(UUID id, String status);

    Optional<Match> deleteMatchById(UUID id);

    List<Match> filterMatches(MatchFilterCriteria criteria);
}
