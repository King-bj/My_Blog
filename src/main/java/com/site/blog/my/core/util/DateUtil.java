package com.site.blog.my.core.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtil {

    private static  final String FORMAT_YYYY_MM = "YYYY-MM";

    /**
     * 获取当前年月
     * @return
     */
    public static String getNowMonth(){
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(FORMAT_YYYY_MM);
        return LocalDateTime.now().format(formatter);
    }

}
