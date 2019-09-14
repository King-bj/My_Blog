package com.site.blog.my.core.entity;

import java.util.HashMap;
import java.util.Map;

/**
 * @author: lajin
 * @Date: 2019/9/14
 * @email:
 * @Description: 自定义返回值
 */
public class RUtils extends HashMap<String, Object> {
    private static final long serialVersionUID = 1L;

    /**
     * 默认正常返回，使用new RUtils()就可以返回
     */
    public RUtils() {
        put("code", 0);
    }

    /**
     * 表示异常
     */
    public static RUtils error() {
        return error(500, "未知异常，请联系管理员");
    }

    public static RUtils error(String msg) {
        return error(500, msg);
    }

    /**
     * 自定义异常错误码
     */
    public static RUtils error(int code, String msg) {
        RUtils r = new RUtils();
        r.put("code", code);
        r.put("msg", msg);
        return r;
    }

    /**
     * 带信息的正常返回
     */
    public static RUtils ok(String msg) {
        RUtils r = new RUtils();
        r.put("msg", msg);
        return r;
    }

    public static RUtils ok(Map<String, Object> map) {
        RUtils r = new RUtils();
        r.putAll(map);
        return r;
    }

    public static RUtils ok() {
        return new RUtils();
    }

    @Override
    public RUtils put(String key, Object value) {
        super.put(key, value);
        return this;
    }
}
