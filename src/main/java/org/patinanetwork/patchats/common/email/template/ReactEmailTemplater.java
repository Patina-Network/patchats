package org.patinanetwork.patchats.common.email.template;

import java.io.IOException;

public interface ReactEmailTemplater {
    /**
     * Load the generated HTML from ClassPathResources as a String then injects variables using Jsoup and renders HTML
     * as a string.
     *
     * @param recipientName
     * @param verifyUrl
     * @param supportEmail
     * @return the rendered HTML as a string
     * @throws IOException
     */
    String createExampleTemplate(String recipientName, String verifyUrl, String supportEmail) throws IOException; //example from CodeBloom

}

