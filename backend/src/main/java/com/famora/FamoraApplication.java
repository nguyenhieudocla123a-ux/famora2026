package com.famora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FamoraApplication {

    public static void main(String[] args) {
        SpringApplication.run(FamoraApplication.class, args);
    }
}
