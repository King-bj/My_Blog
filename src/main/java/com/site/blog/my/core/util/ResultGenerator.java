package com.site.blog.my.core.util;

import com.site.blog.my.core.enums.ExceptionEnum;
import org.springframework.util.StringUtils;

/**
 * 响应结果生成工具
 *
 * @author lajin
 */
public class ResultGenerator {

    public static Result genSuccessResult() {
        Result result = new Result();
        result.setResultCode(ExceptionEnum.SUCCESS.getCode());
        result.setMessage(ExceptionEnum.SUCCESS.getValue());
        return result;
    }

    public static Result genSuccessResult(String message) {
        Result result = new Result();
        result.setResultCode(ExceptionEnum.SUCCESS.getCode());
        result.setMessage(message);
        return result;
    }

    public static Result genSuccessResult(Object data) {
        Result result = new Result();
        result.setResultCode(ExceptionEnum.SUCCESS.getCode());
        result.setMessage(ExceptionEnum.SUCCESS.getValue());
        result.setData(data);
        return result;
    }

    public static Result genFailResult(String message) {
        Result result = new Result();
        result.setResultCode(ExceptionEnum.FAILD.getCode());
        if (StringUtils.isEmpty(message)) {
            result.setMessage(ExceptionEnum.FAILD.getValue());
        } else {
            result.setMessage(message);
        }
        return result;
    }

    public static Result genErrorResult(int code, String message) {
        Result result = new Result();
        result.setResultCode(code);
        result.setMessage(message);
        return result;
    }
}
