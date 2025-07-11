import { useTranslation } from "react-i18next";
import { Form, type FormInstance, Input, Select } from "antd";
import { createSchemaFieldRule } from "antd-zod";
import { z } from "zod";

import Show from "@/components/Show";

type DeployNodeConfigFormAliyunNLBConfigFieldValues = Nullish<{
  resourceType: string;
  region: string;
  loadbalancerId?: string;
  listenerId?: string;
}>;

export type DeployNodeConfigFormAliyunNLBConfigProps = {
  form: FormInstance;
  formName: string;
  disabled?: boolean;
  initialValues?: DeployNodeConfigFormAliyunNLBConfigFieldValues;
  onValuesChange?: (values: DeployNodeConfigFormAliyunNLBConfigFieldValues) => void;
};

const RESOURCE_TYPE_LOADBALANCER = "loadbalancer" as const;
const RESOURCE_TYPE_LISTENER = "listener" as const;

const initFormModel = (): DeployNodeConfigFormAliyunNLBConfigFieldValues => {
  return {
    resourceType: RESOURCE_TYPE_LISTENER,
  };
};

const DeployNodeConfigFormAliyunNLBConfig = ({
  form: formInst,
  formName,
  disabled,
  initialValues,
  onValuesChange,
}: DeployNodeConfigFormAliyunNLBConfigProps) => {
  const { t } = useTranslation();

  const formSchema = z.object({
    resourceType: z.union([z.literal(RESOURCE_TYPE_LOADBALANCER), z.literal(RESOURCE_TYPE_LISTENER)], {
      message: t("workflow_node.deploy.form.aliyun_nlb_resource_type.placeholder"),
    }),
    region: z
      .string({ message: t("workflow_node.deploy.form.aliyun_nlb_region.placeholder") })
      .nonempty(t("workflow_node.deploy.form.aliyun_nlb_region.placeholder")),
    loadbalancerId: z
      .string()
      .max(64, t("common.errmsg.string_max", { max: 64 }))
      .nullish()
      .refine((v) => fieldResourceType !== RESOURCE_TYPE_LOADBALANCER || !!v?.trim(), t("workflow_node.deploy.form.aliyun_nlb_loadbalancer_id.placeholder")),
    listenerId: z
      .string()
      .max(64, t("common.errmsg.string_max", { max: 64 }))
      .nullish()
      .refine((v) => fieldResourceType !== RESOURCE_TYPE_LISTENER || !!v?.trim(), t("workflow_node.deploy.form.aliyun_nlb_listener_id.placeholder")),
  });
  const formRule = createSchemaFieldRule(formSchema);

  const fieldResourceType = Form.useWatch("resourceType", formInst);

  const handleFormChange = (_: unknown, values: z.infer<typeof formSchema>) => {
    onValuesChange?.(values);
  };

  return (
    <Form
      form={formInst}
      disabled={disabled}
      initialValues={initialValues ?? initFormModel()}
      layout="vertical"
      name={formName}
      onValuesChange={handleFormChange}
    >
      <Form.Item name="resourceType" label={t("workflow_node.deploy.form.aliyun_nlb_resource_type.label")} rules={[formRule]}>
        <Select placeholder={t("workflow_node.deploy.form.aliyun_nlb_resource_type.placeholder")}>
          <Select.Option key={RESOURCE_TYPE_LOADBALANCER} value={RESOURCE_TYPE_LOADBALANCER}>
            {t("workflow_node.deploy.form.aliyun_nlb_resource_type.option.loadbalancer.label")}
          </Select.Option>
          <Select.Option key={RESOURCE_TYPE_LISTENER} value={RESOURCE_TYPE_LISTENER}>
            {t("workflow_node.deploy.form.aliyun_nlb_resource_type.option.listener.label")}
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="region"
        label={t("workflow_node.deploy.form.aliyun_nlb_region.label")}
        rules={[formRule]}
        tooltip={<span dangerouslySetInnerHTML={{ __html: t("workflow_node.deploy.form.aliyun_nlb_region.tooltip") }}></span>}
      >
        <Input placeholder={t("workflow_node.deploy.form.aliyun_nlb_region.placeholder")} />
      </Form.Item>

      <Show when={fieldResourceType === RESOURCE_TYPE_LOADBALANCER}>
        <Form.Item
          name="loadbalancerId"
          label={t("workflow_node.deploy.form.aliyun_nlb_loadbalancer_id.label")}
          rules={[formRule]}
          tooltip={<span dangerouslySetInnerHTML={{ __html: t("workflow_node.deploy.form.aliyun_nlb_loadbalancer_id.tooltip") }}></span>}
        >
          <Input placeholder={t("workflow_node.deploy.form.aliyun_nlb_loadbalancer_id.placeholder")} />
        </Form.Item>
      </Show>

      <Show when={fieldResourceType === RESOURCE_TYPE_LISTENER}>
        <Form.Item
          name="listenerId"
          label={t("workflow_node.deploy.form.aliyun_nlb_listener_id.label")}
          rules={[formRule]}
          tooltip={<span dangerouslySetInnerHTML={{ __html: t("workflow_node.deploy.form.aliyun_nlb_listener_id.tooltip") }}></span>}
        >
          <Input placeholder={t("workflow_node.deploy.form.aliyun_nlb_listener_id.placeholder")} />
        </Form.Item>
      </Show>
    </Form>
  );
};

export default DeployNodeConfigFormAliyunNLBConfig;
