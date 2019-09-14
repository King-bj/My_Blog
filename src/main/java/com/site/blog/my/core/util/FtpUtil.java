package com.site.blog.my.core.util;

import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
  * FTP文件上传下载工具类
  * @author 奇点_
  *
  */
public class FtpUtil {
    private static FTPClient ftpClient = new FTPClient();
    private static Logger logger = LoggerFactory.getLogger(FtpUtil.class);

    public static boolean uploadToFtp(File file,String date){
        //FTPClient ftpClient = new FTPClient();
        try {
            //连接ftp服务器 参数填服务器的ip
            ftpClient.connect("129.226.137.36");

            //进行登录 参数分别为账号 密码
            ftpClient.login("user","`123456poilkj");

            //改变工作目录（按自己需要是否改变）
            CreateDirecroty(date);
            //只能选择local_root下已存在的目录
            ftpClient.changeWorkingDirectory(file.getPath());

            //设置文件类型为二进制文件
            ftpClient.setFileType(FTP.BINARY_FILE_TYPE);

            //开启被动模式（按自己如何配置的ftp服务器来决定是否开启）
            ftpClient.enterLocalPassiveMode();

            //上传文件 参数：上传后的文件名，输入流
            ftpClient.storeFile(file.getName(), new FileInputStream(file));
            System.out.println(file.getName());
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }


    //创建目录
    public static boolean makeDirectory(String dir) {
        boolean flag = true;
        try {
            flag = ftpClient.makeDirectory(dir);
            if (flag) {
                logger.debug("创建文件夹" + dir + " 成功！");

            } else {
                logger.debug("创建文件夹" + dir + " 失败！");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return flag;
    }


    //创建多层目录文件，如果有ftp服务器已存在该文件，则不创建，如果无，则创建
    public static boolean CreateDirecroty(String remote) throws IOException {
        boolean success = true;
        String directory = remote + "/";
//        String directory = remote.substring(0, remote.lastIndexOf("/") + 1);
        // 如果远程目录不存在，则递归创建远程服务器目录
        if (!directory.equalsIgnoreCase("/") && !changeWorkingDirectory(new String(directory))) {
            int start = 0;
            int end = 0;
            if (directory.startsWith("/")) {
                start = 1;
            } else {
                start = 0;
            }
            end = directory.indexOf("/", start);
            String path = "";
            String paths = "";
            while (true) {

                String subDirectory = new String(remote.substring(start, end).getBytes("GBK"), "iso-8859-1");
                path = path + "/" + subDirectory;
                if (!existFile(path)) {
                    if (makeDirectory(subDirectory)) {
                        changeWorkingDirectory(subDirectory);
                    } else {
                        logger.debug("创建目录[" + subDirectory + "]失败");
                        changeWorkingDirectory(subDirectory);
                    }
                } else {
                    changeWorkingDirectory(subDirectory);
                }

                paths = paths + "/" + subDirectory;
                start = end + 1;
                end = directory.indexOf("/", start);
                // 检查所有目录是否创建完毕
                if (end <= start) {
                    break;
                }
            }
        }
        return success;
    }





    //判断ftp服务器文件是否存在
    public static boolean existFile(String path) throws IOException {
        boolean flag = false;
        FTPFile[] ftpFileArr = ftpClient.listFiles(path);
        if (ftpFileArr.length > 0) {
            flag = true;
        }
        return flag;
    }

    //上传单个文件
    public boolean uploadFile(File localFile, String remoteFile)
            throws IOException {
        boolean flag = false;
        InputStream in = new FileInputStream(localFile);
        String remote = new String(remoteFile.getBytes("GBK"), "iso-8859-1");
        try {
            if (ftpClient.storeFile(remote, in)) {
                flag = true;
                logger.debug(localFile.getAbsolutePath() + "上传文件成功！");
            } else {
                logger.debug(localFile.getAbsolutePath() + "上传文件失败！");
            }
            in.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return flag;
    }


    //利用递归上传多个多目录文件
    public boolean uploadFiles(String localPathFileName, String remotePathFileName) throws IOException {
        //
        File local = new File(localPathFileName);

        if (local.isDirectory()) {
            try {
                this.ftpClient.changeWorkingDirectory("/");
                CreateDirecroty(remotePathFileName);
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            File local1 = new File(localPathFileName);
            uploadFile(local1, remotePathFileName);
        }
        File sourceFile[] = local.listFiles();
        for (int i = 0; i < sourceFile.length; i++) {
            if (sourceFile[i].exists()) {
                String path = sourceFile[i].getAbsolutePath().substring(localPathFileName.length());
                if (sourceFile[i].isDirectory()) {
                    this.uploadFiles(sourceFile[i].getAbsolutePath(), remotePathFileName + path);
                } else {
                    if (!path.equals("/.DS_Store")) {
                        File file2 = new File(sourceFile[i].getAbsolutePath());
                        uploadFile(file2, remotePathFileName + path);
                    }
                }
            }
        }
        return true;
    }

    //改变目录路径
    public static boolean changeWorkingDirectory(String directory) {
        boolean flag = true;
        try {
            flag = ftpClient.changeWorkingDirectory(directory);
            if (flag) {
                logger.debug("进入文件夹" + directory + " 成功！");

            } else {
                logger.debug("进入文件夹" + directory + " 失败！");
            }
        } catch (IOException ioe) {
            ioe.printStackTrace();
        }
        return flag;
    }
}