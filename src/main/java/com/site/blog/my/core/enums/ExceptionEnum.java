package com.site.blog.my.core.enums;

import org.springframework.http.HttpStatus;

public enum  ExceptionEnum implements BaseEnum<Integer,String> {
    FILENOTFUND(510,"上传路径未配置"),
    FILETYPENOTFUND(511,"只能上传图片"),
    FILENUPLOADFAILED(512,"文件上传本地失败"),
    FILENUPLOADFTPFAILED(513,"文件上传FTP服务器失败"),
    ;

    private int code;
    private String value;

    private ExceptionEnum(Integer code, String value) {
        this.code = code;
        this.value = value;
    }

    @Override
    public String getValue() {
        return value;
    }
    public Integer getCode() {
        return code;
    }

}
