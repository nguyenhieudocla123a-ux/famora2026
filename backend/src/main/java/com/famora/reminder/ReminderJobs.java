package com.famora.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * The two clocks of the reminder system. Turned off in tests (famora.scheduling.enabled=false), where the
 * planner and dispatcher are called directly with a controlled clock.
 * <p>
 * One server for now; with several (Phase 9) the dispatcher is already safe (SELECT ... FOR UPDATE SKIP
 * LOCKED) and the planner is idempotent.
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "famora.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderJobs {

    private static final Logger log = LoggerFactory.getLogger(ReminderJobs.class);

    private final ReminderPlanner planner;
    private final ReminderDispatcher dispatcher;

    public ReminderJobs(ReminderPlanner planner, ReminderDispatcher dispatcher) {
        this.planner = planner;
        this.dispatcher = dispatcher;
    }

    /** Once at start-up, so a server that was down at 00:05 does not leave a day unplanned. */
    @EventListener(ApplicationReadyEvent.class)
    public void planOnStartup() {
        planner.planAll();
    }

    /** 00:05 every night, Vietnam time: move the 30-day window forward. */
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void nightlyPlan() {
        planner.planAll();
    }

    /** Every minute: send what is due. */
    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT20S")
    public void dispatch() {
        int sent = dispatcher.dispatchDue();
        if (sent > 0) {
            log.info("Reminder dispatcher: sent {} notification(s)", sent);
        }
    }
}
