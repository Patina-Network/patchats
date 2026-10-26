package org.patinanetwork.patchats.matchingalgo.pairing;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.model.MemberPair;
import org.patinanetwork.patchats.matchingalgo.model.PairingResult;

/** Base matching layer: every pair scores 0, so members are shuffled and paired in order. */
public class RandomPairer {

    private final Random random;

    public RandomPairer(Random random) {
        this.random = random;
    }

    public PairingResult pair(List<Member> members) {
        List<Member> shuffled = new ArrayList<>(members);
        Collections.shuffle(shuffled, random);

        List<MemberPair> pairs = new ArrayList<>();
        for (int i = 0; i + 1 < shuffled.size(); i += 2) {
            pairs.add(new MemberPair(shuffled.get(i), shuffled.get(i + 1), 0));
        }

        Optional<Member> unmatched = shuffled.size() % 2 == 1 ? Optional.of(shuffled.getLast()) : Optional.empty();
        return new PairingResult(pairs, unmatched);
    }
}
