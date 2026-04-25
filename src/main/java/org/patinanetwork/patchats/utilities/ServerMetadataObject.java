package org.patinanetwork.patchats.utilities;

import com.google.common.base.Strings;
import java.util.ArrayList;
import java.util.Arrays;

public class ServerMetadataObject {

    private String name;
    private String version;
    private String description;
    private ArrayList<String> authors;

    public ServerMetadataObject(final String commitSha) {
        this.name = "PatChats";
        this.version = Strings.isNullOrEmpty(commitSha) ? "unknown" : commitSha;
        this.description = "";
        this.authors = new ArrayList<>(Arrays.asList());
    }

    public ServerMetadataObject() {
        this("unknown");
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(final String version) {
        this.version = version;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(final String description) {
        this.description = description;
    }

    public ArrayList<String> getAuthors() {
        return authors;
    }

    public void setAuthors(final ArrayList<String> authors) {
        this.authors = authors;
    }
}
