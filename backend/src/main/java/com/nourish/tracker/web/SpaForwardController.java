package com.nourish.tracker.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/login",
            "/register",
            "/diary",
            "/log",
            "/log/{id}",
            "/goals",
            "/reports",
            "/chat"
    })
    public String forwardFrontendRoute() {
        return "forward:/index.html";
    }
}
