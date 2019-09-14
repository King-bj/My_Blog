package com.site.blog.my.core.enums;

public enum ImageEnum implements BaseEnum<String,String> {

    //文件类型
    IMG_TYPE_PNG("PNG","PNG"),
    IMG_TYPE_JPG("JPG","JPG"),
    IMG_TYPE_JPEG("JPEG","JPEG"),
    IMG_TYPE_DMG("BMP","BMP"),
    IMG_TYPE_GIF("GIF","GIF"),
    IMG_TYPE_SVG("SVG","SVG"),

    ;
    private String code;
    private String value;

    private ImageEnum(String code, String value) {
        this.code = code;
        this.value = value;
    }

    @Override
    public String getValue() {
        return value;
    }
    public String getCode() {
        return code;
    }
}
