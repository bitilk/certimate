﻿package baotapanelsite

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	xerrors "github.com/pkg/errors"

	"github.com/usual2970/certimate/internal/pkg/core/deployer"
	"github.com/usual2970/certimate/internal/pkg/core/logger"
	"github.com/usual2970/certimate/internal/pkg/utils/slices"
	btsdk "github.com/usual2970/certimate/internal/pkg/vendors/btpanel-sdk"
)

type DeployerConfig struct {
	// 宝塔面板地址。
	ApiUrl string `json:"apiUrl"`
	// 宝塔面板接口密钥。
	ApiKey string `json:"apiKey"`
	// 站点类型。
	SiteType string `json:"siteType"`
	// 站点名称（单个）。
	SiteName string `json:"siteName,omitempty"`
	// 站点名称（多个）。
	SiteNames []string `json:"siteNames,omitempty"`
}

type DeployerProvider struct {
	config    *DeployerConfig
	logger    logger.Logger
	sdkClient *btsdk.Client
}

var _ deployer.Deployer = (*DeployerProvider)(nil)

func NewDeployer(config *DeployerConfig) (*DeployerProvider, error) {
	if config == nil {
		panic("config is nil")
	}

	client, err := createSdkClient(config.ApiUrl, config.ApiKey)
	if err != nil {
		return nil, xerrors.Wrap(err, "failed to create sdk client")
	}

	return &DeployerProvider{
		config:    config,
		logger:    logger.NewNilLogger(),
		sdkClient: client,
	}, nil
}

func (d *DeployerProvider) WithLogger(logger logger.Logger) *DeployerProvider {
	d.logger = logger
	return d
}

func (d *DeployerProvider) Deploy(ctx context.Context, certPem string, privkeyPem string) (*deployer.DeployResult, error) {
	switch d.config.SiteType {
	case "php":
		{
			if d.config.SiteName == "" {
				return nil, errors.New("config `siteName` is required")
			}

			// 设置站点 SSL 证书
			siteSetSSLReq := &btsdk.SiteSetSSLRequest{
				SiteName:    d.config.SiteName,
				Type:        "0",
				Certificate: certPem,
				PrivateKey:  privkeyPem,
			}
			siteSetSSLResp, err := d.sdkClient.SiteSetSSL(siteSetSSLReq)
			if err != nil {
				return nil, xerrors.Wrap(err, "failed to execute sdk request 'bt.SiteSetSSL'")
			} else {
				d.logger.Logt("已设置站点证书", siteSetSSLResp)
			}
		}

	case "other":
		{
			if len(d.config.SiteNames) == 0 {
				return nil, errors.New("config `siteNames` is required")
			}

			// 上传证书
			sslCertSaveCertReq := &btsdk.SSLCertSaveCertRequest{
				Certificate: certPem,
				PrivateKey:  privkeyPem,
			}
			sslCertSaveCertResp, err := d.sdkClient.SSLCertSaveCert(sslCertSaveCertReq)
			if err != nil {
				return nil, xerrors.Wrap(err, "failed to execute sdk request 'bt.SSLCertSaveCert'")
			} else {
				d.logger.Logt("已上传证书", sslCertSaveCertResp)
			}

			// 设置站点证书
			sslSetBatchCertToSiteReq := &btsdk.SSLSetBatchCertToSiteRequest{
				BatchInfo: slices.Map(d.config.SiteNames, func(siteName string) *btsdk.SSLSetBatchCertToSiteRequestBatchInfo {
					return &btsdk.SSLSetBatchCertToSiteRequestBatchInfo{
						SiteName: siteName,
						SSLHash:  sslCertSaveCertResp.SSLHash,
					}
				}),
			}
			sslSetBatchCertToSiteResp, err := d.sdkClient.SSLSetBatchCertToSite(sslSetBatchCertToSiteReq)
			if err != nil {
				return nil, xerrors.Wrap(err, "failed to execute sdk request 'bt.SSLSetBatchCertToSite'")
			} else {
				d.logger.Logt("已设置站点证书", sslSetBatchCertToSiteResp)
			}
		}

	default:
		return nil, fmt.Errorf("unsupported site type: %s", d.config.SiteType)
	}

	return &deployer.DeployResult{}, nil
}

func createSdkClient(apiUrl, apiKey string) (*btsdk.Client, error) {
	if _, err := url.Parse(apiUrl); err != nil {
		return nil, errors.New("invalid baota api url")
	}

	if apiKey == "" {
		return nil, errors.New("invalid baota api key")
	}

	client := btsdk.NewClient(apiUrl, apiKey)
	return client, nil
}
