package org.patinanetwork.patchats.matchingalgo.cli;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.patinanetwork.patchats.api.member.db.models.Member;
import org.patinanetwork.patchats.matchingalgo.MatchingLayer;
import org.patinanetwork.patchats.matchingalgo.mockdata.MatchingMockData;
import org.patinanetwork.patchats.matchingalgo.model.MemberPair;
import org.patinanetwork.patchats.matchingalgo.model.PairingResult;
import org.patinanetwork.patchats.matchingalgo.pairing.RandomPairer;

/**
 * Runs the matching algorithm against {@link MatchingMockData} and prints the pairs, so the output of each layer can be
 * compared. Usage: {@code just match-algo <layer> [seed]}.
 */
public final class MatchingCli {

    private static final long DEFAULT_SEED = 42L;

    private MatchingCli() {}

    public static void main(String[] args) {
        if (args.length < 1) {
            exitWithUsage("Missing layer.");
        }
        Optional<MatchingLayer> layer = MatchingLayer.fromCliName(args[0]);
        if (layer.isEmpty()) {
            exitWithUsage("Unknown layer: " + args[0]);
        }
        long seed = DEFAULT_SEED;
        if (args.length > 1) {
            try {
                seed = Long.parseLong(args[1]);
            } catch (NumberFormatException e) {
                exitWithUsage("Seed must be a number: " + args[1]);
            }
        }

        List<Member> members = MatchingMockData.activeMembers();
        PairingResult result = new RandomPairer(new Random(seed)).pair(members);
        print(layer.get(), seed, members.size(), result, MatchingMockData.pastPairs());
    }

    private static void print(
            MatchingLayer layer, long seed, int memberCount, PairingResult result, Set<Set<UUID>> pastPairs) {
        List<String> layerNames =
                layer.upToAndIncluding().stream().map(MatchingLayer::cliName).toList();
        List<MemberPair> pairs = result.pairs();

        System.out.println("MATCHING RUN");
        System.out.println("  Layers   " + String.join(" -> ", layerNames));
        System.out.println("  Seed     " + seed);
        System.out.println("  Members  " + memberCount + " active");

        System.out.println();
        System.out.println("PAIRS (" + pairs.size() + ")");
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {"#", "Member A", "Member B", "Repeat"});
        List<Integer> repeatNumbers = new ArrayList<>();
        for (int i = 0; i < pairs.size(); i++) {
            MemberPair pair = pairs.get(i);
            boolean repeat = pastPairs.contains(
                    Set.of(pair.memberA().getId(), pair.memberB().getId()));
            if (repeat) {
                repeatNumbers.add(i + 1);
            }
            rows.add(
                    new String[] {String.valueOf(i + 1), name(pair.memberA()), name(pair.memberB()), repeat ? "YES" : ""
                    });
        }
        printTable(rows);

        System.out.println();
        System.out.println("UNMATCHED (" + (result.unmatched().isPresent() ? 1 : 0) + ")");
        System.out.println("  " + result.unmatched().map(MatchingCli::name).orElse("none"));

        System.out.println();
        System.out.println("SUMMARY");
        System.out.printf("  Pairs      %d%n", pairs.size());
        System.out.printf("  Unmatched  %d%n", result.unmatched().isPresent() ? 1 : 0);
        System.out.printf(
                "  Repeats    %d%s%n",
                repeatNumbers.size(),
                repeatNumbers.isEmpty()
                        ? ""
                        : "  (pairs "
                                + String.join(
                                        ", ",
                                        repeatNumbers.stream().map(n -> "#" + n).toList())
                                + ")");
    }

    /** Prints rows as left-aligned columns sized to their widest cell, with a rule under the header row. */
    private static void printTable(List<String[]> rows) {
        int[] widths = new int[rows.getFirst().length];
        for (String[] row : rows) {
            for (int col = 0; col < row.length; col++) {
                widths[col] = Math.max(widths[col], row[col].length());
            }
        }
        for (int r = 0; r < rows.size(); r++) {
            StringBuilder line = new StringBuilder(" ");
            for (int col = 0; col < widths.length; col++) {
                line.append(' ')
                        .append(String.format("%-" + widths[col] + "s", rows.get(r)[col]))
                        .append(' ');
            }
            System.out.println(line.toString().stripTrailing());
            if (r == 0) {
                System.out.println(
                        "  " + "-".repeat(line.toString().stripTrailing().length() - 2));
            }
        }
    }

    private static String name(Member member) {
        return member.getFirstName() + " " + member.getLastName();
    }

    private static void exitWithUsage(String error) {
        System.err.println(error);
        System.err.println("Usage: just match-algo <layer> [seed]");
        System.err.println("Layers: " + String.join(", ", MatchingLayer.cliNames()));
        System.exit(1);
    }
}
