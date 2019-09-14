package com.site.blog.my.core.util;
/**
 * @author: lxw
 * @Date: 2019/2/16 20:00
 * @email:
 * @Description: 自定义异常(继承运行时异常)
 */
public class ExceptionUtils extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * 错误编码
     */
    private int code;

    /**
     * 消息是否为属性文件中的Key
     */
    private boolean propertiesKey = true;

    /**
     * 构造一个基本异常.
     *
     * @param message 信息描述
     */
    public ExceptionUtils(String message) {
        super(message);
    }

    /**
     * 构造一个基本异常.
     *
     * @param code 错误编码
     * @param message   信息描述
     */
    public ExceptionUtils(int code, String message) {
        this(code, message, true);
    }

    /**
     * 构造一个基本异常.
     *
     * @param code 错误编码
     * @param message   信息描述
     */
    public ExceptionUtils(int code, String message, Throwable cause) {
        this(code, message, cause, true);
    }

    /**
     * 构造一个基本异常.
     *
     * @param code     错误编码
     * @param message       信息描述
     * @param propertiesKey 消息是否为属性文件中的Key
     */
    public ExceptionUtils(int code, String message, boolean propertiesKey) {
        super(message);
        this.setCode(code);
        this.setPropertiesKey(propertiesKey);
    }

    /**
     * 构造一个基本异常.
     *
     * @param code 错误编码
     * @param message   信息描述
     */
    public ExceptionUtils(int code, String message, Throwable cause, boolean propertiesKey) {
        super(message, cause);
        this.setCode(code);
        this.setPropertiesKey(propertiesKey);
    }

    /**
     * 构造一个基本异常.
     *
     * @param message 信息描述
     * @param cause   根异常类（可以存入任何异常）
     */
    public ExceptionUtils(String message, Throwable cause) {
        super(message, cause);
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public boolean isPropertiesKey() {
        return propertiesKey;
    }

    public void setPropertiesKey(boolean propertiesKey) {
        this.propertiesKey = propertiesKey;
    }

}