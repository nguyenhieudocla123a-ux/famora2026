package com.famora.support;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import com.jayway.jsonpath.JsonPath;

/** Small HTTP helpers so tests read like the scenario they check. */
public final class TestApi {

    private static final String PASSWORD = "matkhau123";

    private final MockMvc mvc;

    public TestApi(MockMvc mvc) {
        this.mvc = mvc;
    }

    /** Registers a fresh user and returns their access token. */
    public String newUser(String fullName) throws Exception {
        String email = "t" + UUID.randomUUID().toString().substring(0, 10) + "@famora.example";
        mvc.perform(json(MockMvcRequestBuilders.post("/api/auth/register"), """
                {"email": "%s", "password": "%s", "fullName": "%s"}
                """.formatted(email, PASSWORD, fullName))).andExpect(status().isCreated());
        ResultActions login = mvc.perform(json(MockMvcRequestBuilders.post("/api/auth/login"),
                "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, PASSWORD))).andExpect(status().isOk());
        return read(login, "$.accessToken");
    }

    public ResultActions get(String token, String url) throws Exception {
        return mvc.perform(auth(MockMvcRequestBuilders.get(url), token));
    }

    public ResultActions post(String token, String url, String body) throws Exception {
        return mvc.perform(json(auth(MockMvcRequestBuilders.post(url), token), body));
    }

    public ResultActions put(String token, String url, String body) throws Exception {
        return mvc.perform(json(auth(MockMvcRequestBuilders.put(url), token), body));
    }

    public ResultActions patch(String token, String url, String body) throws Exception {
        return mvc.perform(json(auth(MockMvcRequestBuilders.patch(url), token), body));
    }

    public ResultActions delete(String token, String url) throws Exception {
        return mvc.perform(auth(MockMvcRequestBuilders.delete(url), token));
    }

    /** Reads one value from the JSON body of a response. */
    public static <T> T read(ResultActions result, String path) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), path);
    }

    private static MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder b, String token) {
        return b.header("Authorization", "Bearer " + token);
    }

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder b, String body) {
        return b.contentType(MediaType.APPLICATION_JSON).content(body == null ? "{}" : body);
    }
}
