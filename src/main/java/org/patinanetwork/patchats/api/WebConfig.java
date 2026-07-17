package org.patinanetwork.patchats.api;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    /**
     * Configures Spring Boot to serve the React SPA correctly in staging/prod Without this, refreshing on any
     * client-side route (e.g. /sign-up) returns 404 because Spring looks for a file at that path and finds none.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new org.springframework.web.servlet.resource.PathResourceResolver() {
                    @Override
                    protected org.springframework.core.io.Resource getResource(
                            String resourcePath, org.springframework.core.io.Resource location)
                            throws java.io.IOException {
                        var resource = location.createRelative(resourcePath);
                        // Static files are served normally
                        // Fall back to index.html for client-side routing (React Router)
                        return (resource.exists() && resource.isReadable())
                                ? resource
                                : new ClassPathResource("/static/index.html");
                    }
                });
    }
}
