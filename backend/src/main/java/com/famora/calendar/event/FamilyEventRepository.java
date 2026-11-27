package com.famora.calendar.event;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface FamilyEventRepository extends JpaRepository<FamilyEvent, Long> {

    /** IDOR guard: an event id only counts inside the family named in the URL. */
    Optional<FamilyEvent> findByIdAndFamilyIdAndDeletedAtIsNull(Long id, Long familyId);

    /**
     * Two kinds in one query: one-off events dated inside the range, and every yearly event of the family
     * (a few dozen at most), which OccurrenceCalculator expands in memory. No per-event query (no N+1).
     */
    @Query("""
            select e from FamilyEvent e
            where e.familyId = :familyId and e.deletedAt is null
              and (e.recurrence = com.famora.calendar.event.EventEnums.Recurrence.YEARLY
                   or e.solarDate between :from and :to)
            """)
    List<FamilyEvent> candidates(@Param("familyId") Long familyId, @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
