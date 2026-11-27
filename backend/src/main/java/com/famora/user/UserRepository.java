package com.famora.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    /** The email must already be normalised (trimmed, lower-case). */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
