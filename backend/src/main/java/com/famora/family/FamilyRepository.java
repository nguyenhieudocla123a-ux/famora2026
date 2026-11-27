package com.famora.family;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface FamilyRepository extends JpaRepository<Family, Long> {

    Optional<Family> findByIdAndDeletedAtIsNull(Long id);
}
