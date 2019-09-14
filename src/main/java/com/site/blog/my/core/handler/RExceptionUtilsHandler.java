package com.site.blog.my.core.handler;

import com.site.blog.my.core.entity.RUtils;
import com.site.blog.my.core.enums.ExceptionEnum;
import com.site.blog.my.core.util.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.io.IOException;

/**
 * @author: lxw
 * @Date: 2019/2/16 20:00
 * @email:
 * @Description: 自定义异常处理
 */

@RestControllerAdvice
public class RExceptionUtilsHandler {
    private Logger logger = LoggerFactory.getLogger(getClass());

    /**
     * 处理自定义异常
     */
    @ExceptionHandler(ExceptionUtils.class)
    public RUtils handleRRException(ExceptionUtils e) {
        RUtils r = new RUtils();
        r.put("code", e.getCode());
        r.put("msg", e.getMessage());
        return r;
    }

    /**
     * 未找到路径异常处理
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public RUtils handlerNoFoundException(Exception e) {
        logger.error(e.getMessage(), e);
        return RUtils.error(404, "路径不存在，请检查路径是否正确");
    }

    /**
     * 数据库异常处理
     */
    @ExceptionHandler(DuplicateKeyException.class)
    public RUtils handleDuplicateKeyException(DuplicateKeyException e) {
        logger.error(e.getMessage(), e);
        return RUtils.error("数据库中已存在该记录");
    }

    /**
     * 普通异常处理
     */
    @ExceptionHandler(Exception.class)
    public RUtils handleException(Exception e) {
        logger.error(e.getMessage(), e);
        return RUtils.error();
    }

    /**
     * 文件异常处理
     */
    @ExceptionHandler(FileException.class)
    public RUtils handleException(FileException e) {
        logger.error(e.getMessage(), e);
        RUtils r = new RUtils();
        r.put("code", e.getCode());
        r.put("msg", e.getMessage());
        return r;
    }

    /**
     * 文件异常处理
     */
    @ExceptionHandler(IOException.class)
    public RUtils handleException(IOException e) {
        logger.error(e.getMessage(), e);
        RUtils r = new RUtils();
        r.put("code", ExceptionEnum.FILENUPLOADFAILED.getCode());
        r.put("msg", e.getMessage());
        return r;
    }


}