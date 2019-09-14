package com.site.blog.my.core.handler;

import com.site.blog.my.core.enums.ExceptionEnum;
import org.springframework.http.HttpStatus;

public class FileException extends RuntimeException {


    private int code;   // 异常状态码
    public FileException(ExceptionEnum httpStatusEnum) {
        super(httpStatusEnum.getValue());
        code = httpStatusEnum.getCode();
    }

    public int getCode() {
        return code;
    }
}
